import axios from 'axios';
import { tokenService } from './tokenService';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject Bearer token + branch scope on every request
apiClient.interceptors.request.use((config) => {
  const token    = tokenService.get();
  const branchId = tokenService.getBranchId();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Branch scoping precedence:
  // 1. `x-skip-branch` flag → no branch scope (super-admin cross-branch view)
  // 2. caller-provided `x-branch-id` → use it as-is (explicit scoping)
  // 3. otherwise fall back to the persisted branch
  if (config.headers['x-skip-branch']) {
    delete config.headers['x-skip-branch'];
    delete config.headers['x-branch-id'];
  } else if (!config.headers['x-branch-id'] && branchId) {
    config.headers['x-branch-id'] = branchId;
  }

  return config;
});

// On 401 clear token and fire logout event (no refresh endpoint)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      tokenService.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// RTK Query base query wrapping axios
export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params, headers } = {}) => {
    try {
      const result = await apiClient.request({ url, method, data, params, headers });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status ?? 'NETWORK_ERROR',
          data:   err.response?.data   ?? err.message,
        },
      };
    }
  };
