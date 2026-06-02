import { useSelector } from 'react-redux';
import { Coffee, Snowflake, Leaf, GlassWater, Utensils } from 'lucide-react';
import { selectCartItems } from '../features/cart/cartSlice';
import { normaliseProduct, getBasePrice, formatPrice, resolveImageUrl } from '../utils/productHelpers';

const PRODUCT_ICONS = { Coffee, Snowflake, Leaf, GlassWater, Utensils };

function ProductIcon({ name, size = 44 }) {
  const Icon = PRODUCT_ICONS[name] ?? Coffee;
  return <Icon size={size} />;
}

export default function ProductCard({ item, onSelect }) {
  const cartItems = useSelector(selectCartItems);

  const id = item._id ?? item.id;
  const cartQty = cartItems
    .filter((i) => i._id === id || i.id === id || i.id?.startsWith(`${id}-`))
    .reduce((s, i) => s + i.qty, 0);

  const displayPrice = formatPrice(getBasePrice(item));
  const hasSizes     = (item.sizes ?? []).filter((s) => s.isAvailable !== false).length > 0;

  if (item.isAvailable === false) {
    return (
      <div className="product-card product-card--disabled">
        <div className="product-emoji-wrap">
          {item.imageUrl
            ? <img src={resolveImageUrl(item.imageUrl)} alt={item.name} className="product-img" />
            : <span className="product-emoji"><ProductIcon name={normaliseProduct(item).icon} /></span>
          }
        </div>
        <div className="product-info">
          <span className="product-name">{item.name}</span>
          <span className="product-desc">{item.description}</span>
          <div className="product-footer">
            <span className="product-price">{displayPrice}</span>
          </div>
        </div>
        <span className="product-unavailable">Unavailable</span>
      </div>
    );
  }

  return (
    <button
      className={`product-card ${cartQty > 0 ? 'product-card--in-cart' : ''}`}
      onClick={() => onSelect(item)}
    >
      <div className="product-emoji-wrap">
        {item.imageUrl
          ? <img src={resolveImageUrl(item.imageUrl)} alt={item.name} className="product-img" />
          : <span className="product-emoji"><ProductIcon name={normaliseProduct(item).icon} /></span>
        }
        {cartQty > 0 && <span className="product-qty-badge">{cartQty}</span>}
      </div>

      <div className="product-info">
        <span className="product-name">{item.name}</span>
        <span className="product-desc">{item.description}</span>
        <div className="product-footer">
          <div>
            <span className="product-price">{hasSizes ? 'from ' : ''}{displayPrice}</span>
          </div>
          {item.category?.name && (
            <span className="product-cat-tag">{item.category.name}</span>
          )}
        </div>
      </div>

      <div className="product-add-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
    </button>
  );
}
