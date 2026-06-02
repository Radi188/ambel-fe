const ICON_MAP = [
  { keys: ['espresso', 'macchiato', 'cortado', 'americano', 'doppio'], icon: 'Coffee' },
  { keys: ['latte', 'cappuccino', 'flat white', 'chai'],               icon: 'Coffee' },
  { keys: ['cold brew', 'nitro', 'iced'],                              icon: 'Snowflake' },
  { keys: ['matcha', 'tea', 'green'],                                  icon: 'Leaf' },
  { keys: ['croissant'],                                               icon: 'Utensils' },
  { keys: ['muffin', 'blueberry'],                                     icon: 'Utensils' },
  { keys: ['banana', 'bread'],                                         icon: 'Utensils' },
  { keys: ['avocado'],                                                 icon: 'Utensils' },
  { keys: ['cinnamon', 'roll'],                                        icon: 'Utensils' },
  { keys: ['cake', 'pastry', 'pastries'],                              icon: 'Utensils' },
  { keys: ['smoothie', 'juice'],                                       icon: 'GlassWater' },
  { keys: ['float', 'ice cream'],                                      icon: 'GlassWater' },
];

export function getProductIconName(name = '', categoryName = '') {
  const text = `${name} ${categoryName}`.toLowerCase();
  for (const { keys, icon } of ICON_MAP) {
    if (keys.some((k) => text.includes(k))) return icon;
  }
  return 'Coffee';
}

/** First available size price, or top-level price, or 0 */
export function getBasePrice(p) {
  const firstSize = p.sizes?.find((s) => s.isAvailable !== false);
  return firstSize?.price ?? p.price ?? 0;
}

/**
 * Format a price number with the right currency symbol.
 * Values >= 100 are assumed to be KHR (Cambodian Riel).
 * Values <  100 are assumed to be USD.
 */
export function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return '—';
  if (amount >= 100) {
    return `${Number(amount).toLocaleString()} ៛`;
  }
  return `$${Number(amount).toFixed(2)}`;
}

/** Normalise an API product into the shape the cart slice expects */
export function normaliseProduct(p) {
  return {
    id:          p._id,
    _id:         p._id,
    name:        p.name,
    price:       getBasePrice(p),
    sizes:       p.sizes ?? [],
    description: p.description ?? '',
    category:    p.category?.name ?? '',
    categoryId:  p.category?._id ?? p.category,
    imageUrl:    p.imageUrl ?? null,
    isAvailable: p.isAvailable ?? true,
    icon:        getProductIconName(p.name, p.category?.name),
  };
}
