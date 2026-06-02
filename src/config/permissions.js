export const ROLES = {
  CASHIER:     'cashier',
  MANAGER:     'manager',
  SUPER_ADMIN: 'super_admin',
};

const ALL   = [ROLES.CASHIER, ROLES.MANAGER, ROLES.SUPER_ADMIN];
const STAFF = [ROLES.MANAGER, ROLES.SUPER_ADMIN];
const ADMIN = [ROLES.SUPER_ADMIN];

// Which roles can access each POS route
export const POS_PERMISSIONS = {
  '/':                ALL,
  '/dashboard':       STAFF,
  '/orders':          ALL,
  '/menu':            STAFF,
  '/reports':         STAFF,
  '/users':           STAFF,
  '/payment-methods': ADMIN,
  '/exchange-rate':   STAFF,
};

// Which roles can access each Admin route
export const ADMIN_PERMISSIONS = {
  '/admin/dashboard': STAFF,
  '/admin/branches':  ADMIN,
  '/admin/staff':     STAFF,
  '/admin/reports':   STAFF,
  '/admin/menu':      STAFF,
  '/admin/settings':  ADMIN,
};

/** Returns true if role has access to the given path */
export const canAccess = (role, path) => {
  const map = path.startsWith('/admin') ? ADMIN_PERMISSIONS : POS_PERMISSIONS;
  return (map[path] ?? []).includes(role);
};

/** Role display labels */
export const ROLE_LABELS = {
  [ROLES.CASHIER]:     'Cashier',
  [ROLES.MANAGER]:     'Branch Manager',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

/** After login, which path should each role land on? */
export const HOME_ROUTE = {
  [ROLES.CASHIER]:     '/',
  [ROLES.MANAGER]:     '/',
  [ROLES.SUPER_ADMIN]: '/',
};
