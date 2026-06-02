import { useState } from 'react';
import { Check, X, AlertTriangle, Coffee, Pencil, Folder, Trash2 } from 'lucide-react';
import {
  useGetProductsQuery, useGetCategoriesQuery,
  useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
} from '../../store/apis/menuApi';
import { useGetBranchesQuery } from '../../store/apis/branchesApi';
import { getProductIconName, formatPrice } from '../../utils/productHelpers';

const PRODUCT_TYPES = ['main', 'topping'];

// ─── Size rows ────────────────────────────────────────────────────
function SizeEditor({ sizes, onChange, showAvailability }) {
  const add    = () => onChange([...sizes, { name: '', price: '', isAvailable: true }]);
  const remove = (i) => onChange(sizes.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(sizes.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  return (
    <div className="menu-form-sizes">
      {sizes.map((s, i) => (
        <div key={i} className="menu-size-row">
          <input
            className="shift-input"
            placeholder="Name (e.g. S, M, L)"
            value={s.name}
            onChange={(e) => update(i, 'name', e.target.value)}
          />
          <input
            className="shift-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={s.price}
            onChange={(e) => update(i, 'price', e.target.value)}
          />
          {showAvailability && (
            <button
              type="button"
              title={s.isAvailable ? 'Mark unavailable' : 'Mark available'}
              className={`menu-size-avail ${s.isAvailable ? 'menu-size-avail--on' : 'menu-size-avail--off'}`}
              onClick={() => update(i, 'isAvailable', !s.isAvailable)}
            >
              {s.isAvailable ? <Check size={13} /> : <X size={13} />}
            </button>
          )}
          {sizes.length > 1 && (
            <button type="button" className="menu-size-remove" onClick={() => remove(i)} title="Remove size">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      ))}
      <button type="button" className="menu-size-add" onClick={add}>+ Add size</button>
    </div>
  );
}

// ─── Branch multi-select ──────────────────────────────────────────
function BranchPicker({ selected, onChange }) {
  const { data: branches = [], isLoading } = useGetBranchesQuery();

  if (isLoading) return <div className="skeleton" style={{ height: 38, borderRadius: 8 }} />;
  if (!branches.length) return <p style={{ fontSize: 13, color: 'var(--text-lt)' }}>No branches found</p>;

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((b) => b !== id) : [...selected, id]);

  return (
    <div className="menu-branch-grid">
      {branches.map((b) => {
        const active = selected.includes(b._id);
        return (
          <button
            key={b._id}
            type="button"
            className={`menu-branch-chip ${active ? 'menu-branch-chip--active' : ''}`}
            onClick={() => toggle(b._id)}
          >
            <span className="menu-branch-dot" />
            {b.name}
            {!b.isActive && <span style={{ opacity: .5, fontSize: 10 }}> (inactive)</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Product Form Modal ──────────────────────────────────────────
function ProductModal({ product, categories, onClose }) {
  const isEdit = Boolean(product);

  const [form, setForm] = useState(() => {
    if (!isEdit) return {
      name: '', description: '', type: 'main',
      category: categories[0]?._id ?? '',
      sizes: [{ name: '', price: '', isAvailable: true }],
      branches: [],
      imageUrl: '', isAvailable: true,
    };
    return {
      name:        product.name ?? '',
      description: product.description ?? '',
      type:        product.type ?? 'main',
      category:    product.category?._id ?? product.category ?? '',
      sizes:       product.sizes?.length
        ? product.sizes.map((s) => ({ name: s.name, price: String(s.price), isAvailable: s.isAvailable ?? true }))
        : [{ name: '', price: '', isAvailable: true }],
      branches:    (product.branches ?? []).map((b) => b._id ?? b),
      imageUrl:    product.imageUrl ?? '',
      isAvailable: product.isAvailable ?? true,
    };
  });

  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: updating }] = useUpdateProductMutation();
  const [error, setError] = useState('');
  const isLoading = creating || updating;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validSizes = form.sizes.filter((s) => s.name.trim() && s.price !== '');
    if (!validSizes.length) { setError('Add at least one size with a name and price.'); return; }
    if (!form.branches.length) { setError('Select at least one branch for this product.'); return; }

    const body = {
      name:        form.name.trim(),
      type:        form.type,
      category:    form.category,
      isAvailable: form.isAvailable,
      branches:    form.branches,
      sizes:       validSizes.map((s) => ({
        name:  s.name.trim(),
        price: Number(s.price),
        ...(isEdit && { isAvailable: s.isAvailable }),
      })),
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.imageUrl.trim()    && { imageUrl: form.imageUrl.trim() }),
    };

    try {
      if (isEdit) await update({ id: product._id, ...body }).unwrap();
      else        await create(body).unwrap();
      onClose();
    } catch (err) {
      const msgs = err?.data?.message;
      setError(Array.isArray(msgs) ? msgs.join(', ') : (msgs ?? 'Something went wrong.'));
    }
  };

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="menu-form-modal">
        <div className="menu-form-header">
          <h2 className="menu-form-title">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button className="custom-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form className="menu-form-body" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="shift-field">
            <label className="shift-label">Name <span className="menu-required">*</span></label>
            <input className="shift-input" placeholder="e.g. Vanilla Latte" value={form.name}
              onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>

          {/* Description */}
          <div className="shift-field">
            <label className="shift-label">Description</label>
            <textarea className="shift-input custom-note" placeholder="Short description (optional)" rows={2}
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {/* Type + Category */}
          <div className="menu-form-row">
            <div className="shift-field" style={{ flex: 1 }}>
              <label className="shift-label">Type <span className="menu-required">*</span></label>
              <select className="shift-input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="shift-field" style={{ flex: 1 }}>
              <label className="shift-label">Category <span className="menu-required">*</span></label>
              <select className="shift-input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                <option value="">Select category</option>
                {categories.filter((c) => c.isActive !== false).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branches */}
          <div className="shift-field">
            <label className="shift-label">
              Branches <span className="menu-required">*</span>
              <span className="menu-label-hint"> — select all branches that carry this product</span>
            </label>
            <BranchPicker selected={form.branches} onChange={(branches) => set('branches', branches)} />
          </div>

          {/* Sizes */}
          <div className="shift-field">
            <label className="shift-label">
              Sizes <span className="menu-required">*</span>
              {isEdit
                ? <span className="menu-label-hint"> — toggle <Check size={11} style={{display:'inline',verticalAlign:'middle'}} />/<X size={11} style={{display:'inline',verticalAlign:'middle'}} /> to set per-size availability</span>
                : <span className="menu-label-hint"> — add one row per size, each with its own price</span>
              }
            </label>
            <SizeEditor sizes={form.sizes} onChange={(sizes) => set('sizes', sizes)} showAvailability={isEdit} />
          </div>

          {/* Image URL */}
          <div className="shift-field">
            <label className="shift-label">Image URL</label>
            <input className="shift-input" placeholder="https://… (optional)" value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)} />
          </div>

          {/* Available toggle */}
          <div className="menu-form-toggle-row">
            <span className="shift-label" style={{ margin: 0 }}>Available</span>
            <button type="button" className={`menu-toggle ${form.isAvailable ? 'menu-toggle--on' : ''}`}
              onClick={() => set('isAvailable', !form.isAvailable)}>
              <span className="menu-toggle-thumb" />
            </button>
          </div>

          {error && (
            <div className="login-error" style={{ margin: 0, fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="menu-form-actions">
            <button type="button" className="shift-cancel-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className="shift-open-btn" disabled={isLoading}>
              {isLoading ? <span className="login-spinner" /> : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Category Form Modal ─────────────────────────────────────────
function CategoryModal({ category, onClose }) {
  const isEdit = Boolean(category);
  const [create, { isLoading: creating }] = useCreateCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateCategoryMutation();

  const [form, setForm] = useState({
    name:        category?.name        ?? '',
    description: category?.description ?? '',
    isActive:    category?.isActive    ?? true,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    try {
      const body = { name: form.name.trim(), description: form.description.trim() || undefined, isActive: form.isActive };
      if (isEdit) await update({ id: category._id, ...body }).unwrap();
      else        await create(body).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message ?? 'Something went wrong.');
    }
  };

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shift-modal" style={{ width: 400 }}>
        <div className="shift-modal-header">
          <div className="shift-modal-icon">{isEdit ? <Pencil size={28} /> : <Folder size={28} />}</div>
          <h2 className="shift-modal-title">{isEdit ? 'Edit Category' : 'New Category'}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Category Name *</label>
            <input className="shift-input" placeholder="e.g. Espresso" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <input className="shift-input" placeholder="Short description…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="toggle-wrap">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} style={{ display: 'none' }} />
              <div className={`toggle-track ${form.isActive ? 'toggle-track--on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </label>
            <span style={{ fontSize: 13, color: 'var(--text-med)', fontWeight: 500 }}>{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          {error && <div className="login-error" style={{fontSize:12}}>{error}</div>}
          <div className="shift-modal-actions" style={{ marginTop: 4 }}>
            <button type="button" className="shift-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="shift-open-btn" style={{ margin: 0, flex: 1 }} disabled={creating || updating}>
              {(creating || updating) ? <span className="login-spinner" /> : (isEdit ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ────────────────────────────────────────
function ConfirmDelete({ label, onConfirm, onCancel, isLoading }) {
  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="shift-modal" style={{ width: 380, textAlign: 'center' }}>
        <div className="shift-modal-icon"><Trash2 size={28} /></div>
        <h2 className="shift-modal-title">Delete {label}?</h2>
        <p className="shift-modal-sub" style={{ marginBottom: 24 }}>This action cannot be undone.</p>
        <div className="shift-modal-actions">
          <button className="shift-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="shift-close-btn" onClick={onConfirm} disabled={isLoading} style={{ flex: 1 }}>
            {isLoading ? <span className="login-spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function AdminMenuPage() {
  const { data: categories = [], isLoading: catsLoading, isError: catsError } = useGetCategoriesQuery();
  const { data: products   = [], isLoading: prodsLoading, isError: prodsError, refetch } = useGetProductsQuery();
  const [deleteProduct, { isLoading: deletingProd }] = useDeleteProductMutation();
  const [deleteCategory, { isLoading: deletingCat }] = useDeleteCategoryMutation();

  const [tab, setTab]                           = useState('products'); // 'products' | 'categories'
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [search, setSearch]                     = useState('');
  const [productModal, setProductModal]         = useState(null); // null | 'new' | product object
  const [categoryModal, setCategoryModal]       = useState(null);
  const [confirmDelete, setConfirmDelete]       = useState(null); // { type, item }

  const filteredProducts = products.filter((p) => {
    const matchCat    = activeCategoryId === 'all' || p.category?._id === activeCategoryId || p.category === activeCategoryId;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDeleteProduct = async () => {
    await deleteProduct(confirmDelete.item._id).unwrap();
    setConfirmDelete(null);
  };

  const handleDeleteCategory = async () => {
    await deleteCategory(confirmDelete.item._id).unwrap();
    setConfirmDelete(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Menu Management</h1>
          <p className="admin-page-sub">{products.length} products · {categories.length} categories</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'products' && (
            <button className="admin-primary-btn" onClick={() => setProductModal('new')}>+ Add Product</button>
          )}
          {tab === 'categories' && (
            <button className="admin-primary-btn" onClick={() => setCategoryModal('new')}>+ Add Category</button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: -1 }}>
          {['products', 'categories'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: 'none', fontFamily: 'inherit',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t ? 'var(--text-dark)' : 'var(--text-lt)',
                marginBottom: -1,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <>
            <div className="admin-toolbar" style={{ marginTop: 16 }}>
              <div className="so-filters">
                <button className={`so-filter-btn ${activeCategoryId === 'all' ? 'so-filter-btn--active' : ''}`} onClick={() => setActiveCategoryId('all')}>All</button>
                {categories.filter((c) => c.isActive !== false).map((c) => (
                  <button key={c._id} className={`so-filter-btn ${activeCategoryId === c._id ? 'so-filter-btn--active' : ''}`} onClick={() => setActiveCategoryId(c._id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="so-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="so-search" />
              </div>
            </div>

            {(prodsLoading || catsLoading) && (
              <div className="table-loading">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            )}

            {prodsError && (
              <div className="api-error"><AlertTriangle size={20} /><p>Failed to load products</p><button className="retry-btn" onClick={refetch}>Retry</button></div>
            )}

            {!prodsLoading && !prodsError && (
              <div className="so-table-wrap">
                <table className="so-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Sizes</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr><td colSpan="6"><div className="empty-state" style={{padding:'30px 0'}}><Coffee size={32} /><p>No products found</p></div></td></tr>
                    ) : filteredProducts.map((p) => (
                      <tr key={p._id} style={{ opacity: p.isAvailable === false ? .55 : 1 }}>
                        <td>
                          <div className="so-cashier">
                            <span style={{ fontSize: 20 }}>
                              {p.imageUrl
                                ? <img src={p.imageUrl} alt={p.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} />
                                : <Coffee size={22} />
                              }
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{p.name}</div>
                              {p.description && <div style={{ fontSize: 11, color: 'var(--text-lt)' }}>{p.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`menu-type-pill menu-type-pill--${p.type ?? 'main'}`}>
                            {p.type ?? 'main'}
                          </span>
                        </td>
                        <td><span className="cat-pill">{p.category?.name ?? '—'}</span></td>
                        <td>
                          <div className="menu-sizes-list">
                            {(p.sizes ?? []).map((s) => (
                              <span key={s.name} className={`menu-size-chip ${s.isAvailable === false ? 'menu-size-chip--off' : ''}`}
                                title={s.isAvailable === false ? 'Unavailable' : ''}>
                                {s.name} · {formatPrice(s.price)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`so-status ${p.isAvailable !== false ? 'so-status--completed' : 'so-status--pending'}`}>
                            {p.isAvailable !== false ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-outline-btn admin-outline-btn--sm" onClick={() => setProductModal(p)}>Edit</button>
                            <button className="admin-outline-btn admin-outline-btn--sm"
                              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                              onClick={() => setConfirmDelete({ type: 'product', item: p })}
                            >Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Categories tab ── */}
        {tab === 'categories' && (
          <>
            {catsLoading && (
              <div className="table-loading" style={{ marginTop: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            )}

            {catsError && (
              <div className="api-error"><AlertTriangle size={20} /><p>Failed to load categories</p></div>
            )}

            {!catsLoading && !catsError && (
              <div className="so-table-wrap" style={{ marginTop: 16 }}>
                <table className="so-table">
                  <thead>
                    <tr><th>Name</th><th>Description</th><th>Products</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan="5"><div className="empty-state" style={{padding:'30px 0'}}><Folder size={32} /><p>No categories yet</p></div></td></tr>
                    ) : categories.map((cat) => {
                      const count = products.filter((p) => p.category?._id === cat._id || p.category === cat._id).length;
                      return (
                        <tr key={cat._id} style={{ opacity: cat.isActive === false ? .55 : 1 }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{cat.name}</td>
                          <td style={{ color: 'var(--text-lt)' }}>{cat.description || '—'}</td>
                          <td>{count} items</td>
                          <td>
                            <span className={`so-status ${cat.isActive !== false ? 'so-status--completed' : 'so-status--pending'}`}>
                              {cat.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="admin-outline-btn admin-outline-btn--sm" onClick={() => setCategoryModal(cat)}>Edit</button>
                              <button className="admin-outline-btn admin-outline-btn--sm"
                                style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                                onClick={() => setConfirmDelete({ type: 'category', item: cat })}
                              >Del</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {productModal && (
        <ProductModal
          product={productModal === 'new' ? null : productModal}
          categories={categories}
          onClose={() => setProductModal(null)}
        />
      )}
      {categoryModal && (
        <CategoryModal
          category={categoryModal === 'new' ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDelete
          label={confirmDelete.type === 'product' ? confirmDelete.item.name : confirmDelete.item.name}
          onConfirm={confirmDelete.type === 'product' ? handleDeleteProduct : handleDeleteCategory}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deletingProd || deletingCat}
        />
      )}
    </div>
  );
}
