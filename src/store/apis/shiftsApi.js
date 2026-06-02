import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// ShiftStatus: open | closed

export const shiftsApi = createApi({
  reducerPath: 'shiftsApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['Shift'],
  endpoints:   (builder) => ({

    // GET /shifts/active → active shift or null/404
    getActiveShift: builder.query({
      query: () => ({ url: '/shifts/active' }),
      providesTags: [{ type: 'Shift', id: 'ACTIVE' }],
    }),

    // GET /shifts?status=<ShiftStatus>
    getShifts: builder.query({
      query: (params) => ({ url: '/shifts', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Shift', id: _id })), { type: 'Shift', id: 'LIST' }]
          : [{ type: 'Shift', id: 'LIST' }],
    }),

    // GET /shifts/:id
    getShiftById: builder.query({
      query: (id) => ({ url: `/shifts/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Shift', id }],
    }),

    // GET /shifts/:id/summary
    getShiftSummary: builder.query({
      query: (id) => ({ url: `/shifts/${id}/summary` }),
    }),

    // POST /shifts
    // body: { cashierName: string, openingCash: number, cashierId?: string, note?: string, branchId?: string }
    // branch injected from JWT; super_admin must pass branchId which is forwarded as x-branch-id header
    openShift: builder.mutation({
      query: ({ branchId, ...body }) => ({
        url:     '/shifts',
        method:  'POST',
        data:    body,
        headers: branchId ? { 'x-branch-id': branchId } : undefined,
      }),
      invalidatesTags: [{ type: 'Shift', id: 'ACTIVE' }, { type: 'Shift', id: 'LIST' }],
    }),

    // PATCH /shifts/:id/close
    // body: { closingCash: number, note?: string }
    closeShift: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/shifts/${id}/close`, method: 'PATCH', data: body }),
      invalidatesTags: [{ type: 'Shift', id: 'ACTIVE' }, { type: 'Shift', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetActiveShiftQuery,
  useGetShiftsQuery,
  useGetShiftByIdQuery,
  useGetShiftSummaryQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} = shiftsApi;
