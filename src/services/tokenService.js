const TOKEN_KEY  = 'ambel_token';
const BRANCH_KEY = 'ambel_branch_id';
const USER_KEY   = 'ambel_user';

export const tokenService = {
  get:         ()      => localStorage.getItem(TOKEN_KEY),
  set:         (token) => localStorage.setItem(TOKEN_KEY, token),

  getBranchId: ()      => localStorage.getItem(BRANCH_KEY),
  setBranchId: (id)    => id
    ? localStorage.setItem(BRANCH_KEY, id)
    : localStorage.removeItem(BRANCH_KEY),

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Called with the full login response: { accessToken, user }
  save: ({ accessToken, user }) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user?.branchId) {
      localStorage.setItem(BRANCH_KEY, user.branchId);
    } else {
      localStorage.removeItem(BRANCH_KEY); // super_admin has no fixed branch
    }
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(BRANCH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
