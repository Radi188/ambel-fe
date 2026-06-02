import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Coffee, Lock } from 'lucide-react';
import TopBar from '../components/TopBar';
import ProductCard from '../components/ProductCard';
import CartPanel from '../components/CartPanel';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import OpenShiftModal from '../components/OpenShiftModal';
import { selectCurrentShift } from '../features/shifts/shiftsSlice';
import { useGetProductsQuery, useGetCategoriesQuery } from '../store/apis/menuApi';

function SkeletonCard() {
  return (
    <div className="product-card product-card--skeleton">
      <div className="skeleton skeleton-img" />
      <div className="skeleton skeleton-line skeleton-line--md" />
      <div className="skeleton skeleton-line skeleton-line--sm" />
      <div className="skeleton skeleton-line skeleton-line--xs" />
    </div>
  );
}

export default function POSPage() {
  const currentShift = useSelector(selectCurrentShift);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef(null);

  const showNoShiftToast = useCallback(() => {
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleProductSelect = useCallback((item) => {
    if (!currentShift) {
      showNoShiftToast();
      setShowOpenShift(true);
      return;
    }
    setSelectedProduct(item);
  }, [currentShift, showNoShiftToast]);

  const { data: categories = [], isLoading: catsLoading } = useGetCategoriesQuery();
  const { data: products   = [], isLoading: prodsLoading, isError, refetch } = useGetProductsQuery();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable) return false;
      const matchCat    = activeCategoryId === 'all' || p.category?._id === activeCategoryId || p.category === activeCategoryId;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategoryId, search]);

  const isLoading = catsLoading || prodsLoading;

  return (
    <>
      <div className="pos-layout">
        <div className="pos-main">
          <TopBar title="Point of Sale" onSearch={setSearch} searchValue={search} shift={currentShift} />

          <div className="category-bar">
            <button
              className={`cat-btn ${activeCategoryId === 'all' ? 'cat-btn--active' : ''}`}
              onClick={() => setActiveCategoryId('all')}
            >
              All
            </button>
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

          <div className="menu-grid">
            {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

            {isError && (
              <div className="api-error">
                <AlertTriangle size={20} />
                <p>Failed to load products</p>
                <button onClick={refetch} className="retry-btn">Retry</button>
              </div>
            )}

            {!isLoading && !isError && filtered.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                onSelect={handleProductSelect}
              />
            ))}

            {!isLoading && !isError && filtered.length === 0 && (
              <div className="no-results">
                <Coffee size={32} />
                <p>{search ? 'No items match your search' : 'No items in this category'}</p>
              </div>
            )}
          </div>
        </div>

        {currentShift ? (
          <CartPanel />
        ) : (
          <div className="cart-panel cart-no-shift">
            <div className="no-shift-cart">
              <Lock size={32} />
              <p>Open a shift to start taking orders</p>
              <button
                className="shift-open-btn"
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => setShowOpenShift(true)}
              >
                Open Shift
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {showOpenShift && (
        <OpenShiftModal onClose={() => setShowOpenShift(false)} />
      )}

      <div className={`pos-toast ${toast ? 'pos-toast--visible' : ''}`}>
        <Lock size={15} />
        <span>Open a shift first before placing orders</span>
      </div>
    </>
  );
}
