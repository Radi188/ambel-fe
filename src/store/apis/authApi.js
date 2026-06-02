import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// POST /api/auth/login  → { accessToken, user: { id, name, email, role, branch, branchId } }
// GET  /api/auth/me     → user object

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery:   axiosBaseQuery(),
  endpoints:   (builder) => ({

    login: builder.mutation({
      query: ({ email, password }) => ({
        url:    '/auth/login',
        method: 'POST',
        data:   { email, password },
      }),
    }),

    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
    }),

  }),
});

export const { useLoginMutation, useGetMeQuery } = authApi;
