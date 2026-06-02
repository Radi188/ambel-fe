export const SIZES = [
  { key: 'S', label: 'Small',  extra: 0 },
  { key: 'M', label: 'Medium', extra: 0.50 },
  { key: 'L', label: 'Large',  extra: 1.00 },
];

export const DRINK_TOPPINGS = [
  {
    group: 'Milk',
    items: [
      { name: 'Oat Milk',    extra: 0.50 },
      { name: 'Almond Milk', extra: 0.50 },
      { name: 'Soy Milk',    extra: 0.50 },
    ],
  },
  {
    group: 'Extras',
    items: [
      { name: 'Extra Shot',        extra: 0.75 },
      { name: 'Whipped Cream',     extra: 0.50 },
      { name: 'Vanilla Syrup',     extra: 0.50 },
      { name: 'Caramel Syrup',     extra: 0.50 },
      { name: 'Hazelnut Syrup',    extra: 0.50 },
      { name: 'Brown Sugar Syrup', extra: 0.50 },
    ],
  },
  {
    group: 'Ice & Temp',
    items: [
      { name: 'Hot',       extra: 0 },
      { name: 'Less Ice',  extra: 0 },
      { name: 'No Ice',    extra: 0 },
      { name: 'Extra Ice', extra: 0 },
    ],
  },
  {
    group: 'Sweetness',
    items: [
      { name: 'No Sugar',    extra: 0 },
      { name: 'Less Sweet',  extra: 0 },
      { name: 'Extra Sweet', extra: 0 },
    ],
  },
];

export const FOOD_TOPPINGS = [
  {
    group: 'Options',
    items: [
      { name: 'Warmed',    extra: 0 },
      { name: 'No Butter', extra: 0 },
      { name: 'Extra Jam', extra: 0.50 },
    ],
  },
];

const FOOD_KEYWORDS = ['pastry', 'pastries', 'food', 'bread', 'cake', 'snack', 'sandwich', 'toast', 'muffin', 'croissant', 'roll', 'avocado'];

export function isFood(categoryName = '', productName = '') {
  const text = `${categoryName} ${productName}`.toLowerCase();
  return FOOD_KEYWORDS.some((k) => text.includes(k));
}

export function getToppingGroups(categoryName, productName) {
  return isFood(categoryName, productName) ? FOOD_TOPPINGS : DRINK_TOPPINGS;
}

export function getToppingExtra(name) {
  const all = [...DRINK_TOPPINGS, ...FOOD_TOPPINGS].flatMap((g) => g.items);
  return all.find((t) => t.name === name)?.extra ?? 0;
}
