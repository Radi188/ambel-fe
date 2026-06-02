import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, AlertTriangle, Coffee, Snowflake, Leaf, GlassWater, Utensils, Upload, Image as ImageIcon } from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
} from '../store/apis/menuApi';
import { useGetBranchesQuery } from '../store/apis/branchesApi';
import { getProductIconName, formatPrice } from '../utils/productHelpers';

const PRODUCT_ICONS = { Coffee, Snowflake, Leaf, GlassWater, Utensils };
function ProductIcon({ name, size = 22 }) {
  const Icon = PRODUCT_ICONS[name] ?? Coffee;
  return <Icon size={size} />;
}

const PRODUCT_TYPES = ['main', 'topping'];

const EMPTY_FORM = {
  name: '',
  description: '',
  type: 'main',
  category: '',
  sizes: [{ name: '', price: '', isAvailable: true }],
  branches: [],
  imageUrl: '',
  isAvailable: true,
};

function canManage(role) { return role === 'manager' || role === 'super_admin'; }
function isSuperAdmin(role) { return role === 'super_admin'; }

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
            <button
              type="button"
              className="menu-size-remove"
              onClick={() => remove(i)}
              title="Remove size"
            >
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

// ─── Create / Edit modal ──────────────────────────────────────────
function ProductFormModal({ product, categories, userRole, onClose }) {
  const isEdit   = Boolean(product);
  const isAdmin  = isSuperAdmin(userRole);

  const [form, setForm] = useState(() => {
    if (!isEdit) return { ...EMPTY_FORM, category: categories[0]?._id ?? '' };
    return {
      name:        product.name ?? '',
      description: product.description ?? '',
      type:        product.type ?? 'main',
      category:    product.category?._id ?? product.category ?? '',
      sizes:       product.sizes?.length
        ? product.sizes.map((s) => ({
            name:        s.name,
            price:       String(s.price),
            isAvailable: s.isAvailable ?? true,
          }))
        : [{ name: '', price: '', isAvailable: true }],
      // branches can be populated objects or plain IDs
      branches:    (product.branches ?? []).map((b) => b._id ?? b),
      imageUrl:    product.imageUrl ?? '',
      isAvailable: product.isAvailable ?? true,
    };
  });

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [uploadImage,   { isLoading: uploading }] = useUploadProductImageMutation();
  const [error, setError]     = useState('');
  // Once created, remember the id so a retry edits instead of creating a duplicate.
  const [savedId, setSavedId] = useState(product?._id ?? null);
  const [imageFile, setImageFile] = useState(null); // File chosen from computer
  const isLoading             = creating || updating || uploading;

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Preview: a freshly picked file, otherwise the existing/typed URL.
  const previewSrc = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return form.imageUrl || null;
  }, [imageFile, form.imageUrl]);

  // An uploaded image is stored as a /uploads/... path — show a clean caption
  // for it instead of exposing the raw internal path in the URL input.
  const isUploadedImage = !imageFile && form.imageUrl.startsWith('/uploads/');

  useEffect(() => {
    if (imageFile && previewSrc) return () => URL.revokeObjectURL(previewSrc);
  }, [previewSrc, imageFile]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)     { setError('Image must be 5 MB or smaller.'); return; }
    setError('');
    setImageFile(file);
    set('imageUrl', ''); // a chosen file takes precedence over a typed URL
  };

  const clearImage = () => { setImageFile(null); set('imageUrl', ''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validSizes = form.sizes.filter((s) => s.name.trim() && s.price !== '');
    if (!validSizes.length) { setError('Add at least one size with a name and price.'); return; }

    // Super admin has no fixed branch — they must explicitly select at least one
    if (isAdmin && !form.branches.length) {
      setError('Select at least one branch for this product.');
      return;
    }

    const body = {
      name:        form.name.trim(),
      type:        form.type,
      category:    form.category,
      isAvailable: form.isAvailable,
      sizes:       validSizes.map((s) => ({
        name:  s.name.trim(),
        price: Number(s.price),
        ...(isEdit && { isAvailable: s.isAvailable }),
      })),
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.imageUrl.trim()    && { imageUrl: form.imageUrl.trim() }),
      // Always send branches for admin so the server overwrites the array correctly
      ...(isAdmin && form.branches.length && { branches: form.branches }),
    };

    try {
      // Create or update first so we have a product id to attach the image to.
      let id = savedId;
      if (id) {
        await updateProduct({ id, ...body }).unwrap();
      } else {
        const created = await createProduct(body).unwrap();
        id = created._id;
        setSavedId(id);
      }
      // Upload the chosen file (if any) after the product exists.
      if (imageFile) {
        await uploadImage({ id, file: imageFile }).unwrap();
        setImageFile(null);
      }
      onClose();
    } catch (err) {
      const msgs = err?.data?.message;
      setError(Array.isArray(msgs) ? msgs.join(', ') : (msgs ?? 'Failed to save product'));
    }
  };

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="menu-form-modal">
        <div className="menu-form-header">
          <h2 className="menu-form-title">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
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
            <input
              className="shift-input"
              placeholder="e.g. Caramel Latte"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="shift-field">
            <label className="shift-label">Description</label>
            <textarea
              className="shift-input custom-note"
              placeholder="Short description (optional)"
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
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
              <select
                className="shift-input"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branches — shown first for super_admin so it's never below the fold */}
          {isAdmin && (
            <div className="shift-field">
              <label className="shift-label">
                Branches <span className="menu-required">*</span>
                <span className="menu-label-hint"> — select all branches that carry this product</span>
              </label>
              <BranchPicker
                selected={form.branches}
                onChange={(branches) => set('branches', branches)}
              />
            </div>
          )}

          {/* Sizes */}
          <div className="shift-field">
            <label className="shift-label">
              Sizes <span className="menu-required">*</span>
              {isEdit
                ? <span className="menu-label-hint"> — toggle <Check size={11} style={{display:'inline',verticalAlign:'middle'}} />/<X size={11} style={{display:'inline',verticalAlign:'middle'}} /> to set per-size availability</span>
                : <span className="menu-label-hint"> — add one row per size, each with its own price</span>
              }
            </label>
            <SizeEditor
              sizes={form.sizes}
              onChange={(sizes) => set('sizes', sizes)}
              showAvailability={isEdit}
            />
          </div>

          {/* Image — upload from computer or paste a URL */}
          <div className="shift-field">
            <label className="shift-label">Image</label>
            <div className="menu-image-field">
              <div className="menu-image-preview">
                {previewSrc
                  ? <img src={previewSrc} alt="Preview" />
                  : <span className="menu-image-placeholder"><ImageIcon size={20} /></span>}
              </div>
              <div className="menu-image-controls">
                <div className="menu-image-btns">
                  <label className="menu-upload-btn">
                    <Upload size={14} />
                    {imageFile || form.imageUrl ? 'Change image' : 'Upload from computer'}
                    <input type="file" accept="image/*" onChange={handleFile} hidden />
                  </label>
                  {(imageFile || form.imageUrl) && (
                    <button type="button" className="menu-image-remove" onClick={clearImage}>Remove</button>
                  )}
                </div>
                {imageFile ? (
                  <span className="menu-image-caption">{imageFile.name} — uploads when you save</span>
                ) : isUploadedImage ? (
                  <span className="menu-image-caption">Uploaded from computer</span>
                ) : (
                  <input
                    className="shift-input"
                    placeholder="…or paste an image URL"
                    value={form.imageUrl}
                    onChange={(e) => { set('imageUrl', e.target.value); setImageFile(null); }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Available toggle */}
          <div className="menu-form-toggle-row">
            <span className="shift-label" style={{ margin: 0 }}>Available</span>
            <button
              type="button"
              className={`menu-toggle ${form.isAvailable ? 'menu-toggle--on' : ''}`}
              onClick={() => set('isAvailable', !form.isAvailable)}
            >
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
              {isLoading ? <span className="login-spinner" /> : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm inline ────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel, isLoading }) {
  return (
    <div className="menu-delete-confirm">
      <span>Delete this product?</span>
      <button className="menu-del-yes" onClick={onConfirm} disabled={isLoading}>
        {isLoading
          ? <span className="login-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
          : 'Delete'}
      </button>
      <button className="menu-del-no" onClick={onCancel} disabled={isLoading}>Cancel</button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function MenuPage() {
  const user      = useSelector(selectUser);
  const isManager = canManage(user?.role);

  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [typeFilter, setTypeFilter]             = useState('all');
  const [search, setSearch]                     = useState('');
  const [formProduct, setFormProduct]           = useState(null);
  const [confirmDeleteId, setConfirmDeleteId]   = useState(null);

  const { data: categories = [], isLoading: catsLoading }                        = useGetCategoriesQuery();
  const { data: products   = [], isLoading: prodsLoading, isError, refetch }     = useGetProductsQuery();
  const [deleteProduct, { isLoading: deleting }]                                  = useDeleteProductMutation();

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategoryId !== 'all')
      list = list.filter((p) => p.category?._id === activeCategoryId || p.category === activeCategoryId);
    if (typeFilter !== 'all')
      list = list.filter((p) => (p.type ?? 'main') === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategoryId, typeFilter, search]);

  const isLoading = catsLoading || prodsLoading;

  const handleDelete = async (id) => {
    try { await deleteProduct(id).unwrap(); setConfirmDeleteId(null); } catch { /* noop */ }
  };

  return (
    <div className="page-layout">
      <TopBar title="Menu" />
      <div className="page-content">

        {/* ── Toolbar ── */}
        <div className="menu-toolbar">
          <div className="menu-filters">
            <div className="topbar-search">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="menu-type-tabs">
              {['all', 'main', 'topping'].map((t) => (
                <button
                  key={t}
                  className={`cat-btn ${typeFilter === t ? 'cat-btn--active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isManager && (
            <button className="menu-add-btn" onClick={() => setFormProduct(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Product
            </button>
          )}
        </div>

        {/* ── Category bar ── */}
        <div className="category-bar">
          <button className={`cat-btn ${activeCategoryId === 'all' ? 'cat-btn--active' : ''}`} onClick={() => setActiveCategoryId('all')}>All</button>
          {categories.filter((c) => c.isActive !== false).map((cat) => (
            <button
              key={cat._id}
              className={`cat-btn ${activeCategoryId === cat._id ? 'cat-btn--active' : ''}`}
              onClick={() => setActiveCategoryId(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="table-loading">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        )}

        {isError && (
          <div className="api-error">
            <AlertTriangle size={20} />
            <p>Failed to load menu</p>
            <button onClick={refetch} className="retry-btn">Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <table className="menu-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Category</th>
                <th>Sizes</th>
                <th>Status</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 6 : 5}>
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      <Coffee size={32} /><p>No items found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((item) => (
                <tr key={item._id} style={{ opacity: item.isAvailable === false ? .45 : 1 }}>
                  {/* Item */}
                  <td>
                    <div className="menu-table-name">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="menu-table-img" />
                        : <span className="menu-table-emoji"><ProductIcon name={getProductIconName(item.name, item.category?.name)} /></span>
                      }
                      <div>
                        <span className="menu-item-name">{item.name}</span>
                        {item.description && <span className="menu-item-desc">{item.description}</span>}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span className={`menu-type-pill menu-type-pill--${item.type ?? 'main'}`}>
                      {item.type ?? 'main'}
                    </span>
                  </td>

                  {/* Category */}
                  <td><span className="cat-pill">{item.category?.name ?? '—'}</span></td>

                  {/* Sizes */}
                  <td>
                    <div className="menu-sizes-list">
                      {(item.sizes ?? []).map((s) => (
                        <span
                          key={s.name}
                          className={`menu-size-chip ${s.isAvailable === false ? 'menu-size-chip--off' : ''}`}
                          title={s.isAvailable === false ? 'Unavailable' : ''}
                        >
                          {s.name} · {formatPrice(s.price)}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`so-status ${item.isAvailable !== false ? 'so-status--completed' : 'so-status--pending'}`}>
                      {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </td>

                  {/* Actions */}
                  {isManager && (
                    <td style={{ textAlign: 'right' }}>
                      {confirmDeleteId === item._id ? (
                        <DeleteConfirm
                          onConfirm={() => handleDelete(item._id)}
                          onCancel={() => setConfirmDeleteId(null)}
                          isLoading={deleting}
                        />
                      ) : (
                        <div className="menu-action-btns">
                          <button className="menu-action-btn menu-action-btn--edit" onClick={() => setFormProduct(item)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button className="menu-action-btn menu-action-btn--delete" onClick={() => setConfirmDeleteId(item._id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formProduct !== null && (
        <ProductFormModal
          product={formProduct || null}
          categories={categories.filter((c) => c.isActive !== false)}
          userRole={user?.role}
          onClose={() => setFormProduct(null)}
        />
      )}

    </div>
  );
}
