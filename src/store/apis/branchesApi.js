import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// Super admin only

export const branchesApi = createApi({
  reducerPath: 'branchesApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['Branch'],
  endpoints:   (builder) => ({

    // GET /branches?active=true
    getBranches: builder.query({
      query: (params) => ({ url: '/branches', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Branch', id: _id })), { type: 'Branch', id: 'LIST' }]
          : [{ type: 'Branch', id: 'LIST' }],
    }),

    getBranchById: builder.query({
      query: (id) => ({ url: `/branches/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Branch', id }],
    }),

    // POST /branches  body: { name, address?, phone?, email?, isActive? }
    createBranch: builder.mutation({
      query: (body) => ({ url: '/branches', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),

    // PATCH /branches/:id
    updateBranch: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/branches/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Branch', id }, { type: 'Branch', id: 'LIST' }],
    }),

    // DELETE /branches/:id
    deleteBranch: builder.mutation({
      query: (id) => ({ url: `/branches/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
