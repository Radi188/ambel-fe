import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// UserRole: super_admin | manager | cashier

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['User', 'Cashier'],
  endpoints:   (builder) => ({

    // ── Users (staff accounts) ──────────────────────────────────
    // GET /users?role=<UserRole>
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'User', id: _id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    // POST /users
    // body: { name, email, password, role?, branch?, isActive? }
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // PATCH /users/:id
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    // PATCH /users/:id/password  body: { password }
    changeUserPassword: builder.mutation({
      query: ({ id, password }) => ({
        url:    `/users/${id}/password`,
        method: 'PATCH',
        data:   { password },
      }),
    }),

    // DELETE /users/:id  (super_admin only)
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // ── Cashiers (physical cashier profiles used in shifts) ─────
    // GET /cashiers?active=true
    getCashiers: builder.query({
      query: (params) => ({ url: '/cashiers', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Cashier', id: _id })), { type: 'Cashier', id: 'LIST' }]
          : [{ type: 'Cashier', id: 'LIST' }],
    }),

    getCashierById: builder.query({
      query: (id) => ({ url: `/cashiers/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Cashier', id }],
    }),

    // POST /cashiers  body: { name, isActive? }  (branch from JWT)
    createCashier: builder.mutation({
      query: (body) => ({ url: '/cashiers', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Cashier', id: 'LIST' }],
    }),

    updateCashier: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/cashiers/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Cashier', id }, { type: 'Cashier', id: 'LIST' }],
    }),

    deleteCashier: builder.mutation({
      query: (id) => ({ url: `/cashiers/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Cashier', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserPasswordMutation,
  useDeleteUserMutation,
  useGetCashiersQuery,
  useGetCashierByIdQuery,
  useCreateCashierMutation,
  useUpdateCashierMutation,
  useDeleteCashierMutation,
} = staffApi;
